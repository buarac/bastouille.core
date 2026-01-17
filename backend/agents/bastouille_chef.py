import logging
import json
import asyncio
from typing import List, Dict, Any, Optional
from google.genai import types

from core.gemini import get_gemini_client
from functions import (
    liste_varietes,
    rechercher,
    lister_sujets,
    creer_sujet,
    noter_evenement,
    historique
)

logger = logging.getLogger(__name__)

class BastouilleChef:
    def __init__(self):
        self.client = get_gemini_client()
        
        # Registry of Native Tools
        self.available_tools_logic = {
            "liste_varietes": liste_varietes.liste_varietes,
            "rechercher": rechercher.rechercher,
            "lister_sujets": lister_sujets.lister_sujets,
            "creer_sujet": creer_sujet.creer_sujet,
            "noter_evenement": noter_evenement.noter_evenement,
            "historique": historique.historique
        }
        
        # Declarations for the Model
        self.tool_declarations = [
            types.Tool(function_declarations=[
                liste_varietes.liste_varietes_definition,
                rechercher.rechercher_definition,
                lister_sujets.lister_sujets_definition,
                creer_sujet.creer_sujet_definition,
                noter_evenement.noter_evenement_definition,
                historique.historique_definition
            ])
        ]
        
        # System Prompt
        self.system_prompt = """Tu es Baštouille, le Chef de Culture.
Tu es un expert en jardinage, rustique, précis et serviable.
Tu gères le jardin via des outils précis.
1. Utilise 'rechercher' ou 'lister_sujets' pour comprendre le contexte avant d'agir.
2. Pour créer une culture, il faut un nom, une quantité et une unité valide.
3. Note scrupuleusement les événements.
4. Si on te demande ce que tu sais faire, liste tes capacités (Outils).
5. IMPORTANT : Avant de créer quoi que ce soit, VÉRIFIE que la plante existe dans le référentiel botanique avec 'rechercher'.
   - Si tu ne trouves pas la variété exacte, DEMANDE à l'utilisateur de préciser (ex: "Quelle variété de Betterave ?").
   - Ne crée jamais de sujet sur une plante inconnue ou ambigüe.
6. Avant de répondre, pense étape par étape à la solution.
7. Sois concis.
8. OPTIMISATION : Si tu dois récupérer des infos pour plusieurs sujets (ex: historique de 5 plantes), lance TOUS les appels d'outils EN MÊME TEMPS (parallèle) dans la même réponse. N'attends pas le résultat de l'un pour lancer l'autre.
"""

    async def chat_stream(self, user_message: str, history: List[Dict[str, str]] = [], conversation_id: str = None):
        """
        Chat loop supporting Native Function Calling via Gemini.
        Yields JSON (SSE) for frontend.
        Args:
            user_message: The new message
            history: List of dicts [{"role": "user", "content": "..."}]
            conversation_id: The session ID for logging
        """
        # 0. Build Contents with History
        # We need to convert Frontend [{role, content}] to Gemini [types.Content]
        contents = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part(text=msg.get("content", ""))]))

        # Add current message
        contents.append(types.Content(role="user", parts=[types.Part(text=user_message)]))
        
        # Initialize loop variables
        current_history = list(contents) 
        MAX_TURNS = 30 # Increased from 5 to avoid blocking on lists
        turn_count = 0
        
        # We enter the loop immediately. The loop logic will handle the "First Call" as iteration 1.
        while turn_count < MAX_TURNS:
            turn_count += 1
            
            # Generate Content (This handles both initial answer and subsequent tool outputs)
            response = await self.client.generate_content(
                contents=current_history,
                config=types.GenerateContentConfig(
                    tools=self.tool_declarations,
                    temperature=0.2,
                    system_instruction=self.system_prompt
                ),
                agent_name="Baštouille.Chef",
                # Trace ID includes turn count
                trace_id=f"turn-{int(asyncio.get_event_loop().time())}-{turn_count}",
                conversation_id=conversation_id
            )
            
            if not response.candidates:
                 yield json.dumps({"type": "message_token", "content": "⚠️ Erreur: Réponse vide du modèle."}) + "\n"
                 return

            # Note: A single candidate can have multiple parts (e.g. Text then FunctionCall)
            parts = response.candidates[0].content.parts
            
            # Add this turn's response to history (all parts)
            current_history.append(types.Content(role="model", parts=parts))
            
            has_tool_use = False
            
            for part in parts:
                # 1. Text Response (Thought or Final Answer)
                if part.text:
                    # If this text part uses tool, it might be reasoning
                    # For now, we simply yield it as message/thought based on context?
                    # Simplify: Logic used to be "if function_call follows, it is thought".
                    
                    is_thought = False
                    if any(p.function_call for p in parts) and part != parts[-1]:
                         is_thought = True
                    
                    if is_thought:
                         yield json.dumps({"type": "thought_token", "content": part.text}) + "\n"
                    else:
                         yield json.dumps({"type": "message_token", "content": part.text}) + "\n"

                # 2. Function Call
                if part.function_call:
                    has_tool_use = True
                    fn_call = part.function_call
                    fn_name = fn_call.name
                    fn_args = fn_call.args
                    
                    # Notify UI: Tool Start
                    yield json.dumps({"type": "step_start", "tool": fn_name, "args": fn_args}) + "\n"
                    
                    # Execute Python Function
                    result_data = {}
                    if fn_name in self.available_tools_logic:
                        try:
                            result_data = self.available_tools_logic[fn_name](**fn_args)
                        except Exception as e:
                            result_data = {"error": str(e)}
                    else:
                        result_data = {"error": f"Function {fn_name} not found."}
                    
                    # Notify UI: Tool End
                    yield json.dumps({"type": "step_end", "tool": fn_name, "result": json.dumps(result_data, default=str)}) + "\n"
                    
                    # Create Response Part for History
                    fn_response_part = types.Part(
                        function_response=types.FunctionResponse(
                            name=fn_name,
                            response={"result": result_data}
                        )
                    )
                    
                    # Add Result to History (User role for function response in Gemini API)
                    current_history.append(types.Content(role="user", parts=[fn_response_part]))
            
            # Logic flow control
            if has_tool_use:
                # Continue loop to get next step/final answer
                continue
            else:
                # No tool used, just text (already yielded above), so we are done
                return
        
        # If we reach here, MAX_TURNS was exceeded
        yield json.dumps({"type": "message_token", "content": "\n\n⚠️ **Alerte sécurité** : J'ai atteint ma limite de réflexion (30 étapes). J'arrête ici pour ne pas tourner en rond."}) + "\n"
