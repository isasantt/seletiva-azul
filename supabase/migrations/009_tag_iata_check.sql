  -- Garante no banco a regra IATA de 10 dígitos, independentemente do front-end.
  --
  -- O schema v2 já cria `malas_tag_iata_chk` (validada) e
  -- `malas_tag_iata_uq`. Nesse caso esta migração não cria uma segunda CHECK.
  -- Se a constraint ainda não existir, cria com NOT VALID para não falhar com
  -- dados antigos; novas linhas e updates continuam sendo validados.
  do $$
  begin
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.malas'::regclass
        and contype = 'c'
        and conname in ('malas_tag_iata_chk', 'malas_tag_iata_iata_check')
    ) then
      alter table public.malas
        add constraint malas_tag_iata_iata_check
        check (tag_iata is null or tag_iata ~ '^[0-9]{10}$') not valid;
    end if;
  end $$;

  -- Opcional, se todos os dados atuais já estiverem corretos:
  -- alter table public.malas validate constraint malas_tag_iata_iata_check;
