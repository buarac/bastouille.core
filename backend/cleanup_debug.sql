delete from evenements where sujet_id in (select id from sujets where nom like 'Tomate B0%');
delete from sujets where nom like 'Tomate B0%';
