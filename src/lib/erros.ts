type ErroComMensagem = {
  message?: unknown;
  code?: unknown;
};

type Regra = {
  teste: RegExp;
  mensagem: string;
};

const REGRAS: Regra[] = [
  {
    teste: /email[_ ]not[_ ]confirmed|email not confirmed/i,
    mensagem:
      'E-mail ainda não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.',
  },
  {
    teste: /invalid[_ ]login[_ ]credentials|invalid login credentials/i,
    mensagem: 'E-mail ou senha inválidos.',
  },
  {
    teste: /user[_ ]already[_ ]registered|user already registered|email[_ ]exists/i,
    mensagem: 'Este e-mail já está cadastrado. Tente entrar.',
  },
  {
    teste: /email[_ ]address[_ ]invalid|invalid format|invalid email|email address.*invalid/i,
    mensagem: 'Informe um e-mail válido.',
  },
  {
    teste: /weak[_ ]password|password should be at least|password is too short/i,
    mensagem: 'A senha é muito fraca. Use ao menos 6 caracteres.',
  },
  {
    teste: /same[_ ]password|new password should be different/i,
    mensagem: 'A nova senha precisa ser diferente da senha atual.',
  },
  {
    teste: /over[_ ]email[_ ]send[_ ]rate[_ ]limit|email rate limit exceeded/i,
    mensagem: 'Muitas tentativas de envio. Aguarde alguns minutos e tente novamente.',
  },
  {
    teste: /over[_ ]request[_ ]rate[_ ]limit|rate limit/i,
    mensagem: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  },
  {
    teste: /signup[_ ]disabled|signups? not allowed|signup is disabled/i,
    mensagem: 'O cadastro está desativado no momento.',
  },
  {
    teste: /email[_ ]provider[_ ]disabled|email signups? (are )?disabled/i,
    mensagem: 'O cadastro por e-mail está desativado no momento.',
  },
  {
    teste: /email[_ ]address[_ ]not[_ ]authorized/i,
    mensagem: 'Este e-mail não está autorizado a se cadastrar.',
  },
  {
    teste:
      /session[_ ]not[_ ]found|auth session missing|refresh[_ ]token[_ ]not[_ ]found|jwt expired|token has expired|invalid jwt/i,
    mensagem: 'Sua sessão expirou. Entre novamente.',
  },
  {
    teste:
      /otp[_ ]expired|email link is invalid or has expired|link.*expired|flow[_ ]state[_ ]expired/i,
    mensagem: 'O link expirou. Solicite um novo e-mail.',
  },
  {
    teste: /user[_ ]not[_ ]found|user not found/i,
    mensagem: 'Usuário não encontrado.',
  },
  {
    teste: /validation[_ ]failed|invalid input|invalid value/i,
    mensagem: 'Os dados informados são inválidos.',
  },
  {
    teste: /captcha/i,
    mensagem: 'Não foi possível validar o captcha. Tente novamente.',
  },
  {
    teste:
      /network request failed|failed to fetch|fetch failed|network error|load failed|timeout|timed out|internet/i,
    mensagem: 'Falha de conexão. Verifique sua internet e tente novamente.',
  },
  {
    teste: /permission denied|row-level security|insufficient privilege/i,
    mensagem: 'Você não tem permissão para realizar esta ação.',
  },
  {
    teste: /duplicate key|unique constraint/i,
    mensagem: 'Este registro já existe.',
  },
  {
    teste: /foreign key constraint/i,
    mensagem: 'Este registro está vinculado a outro item e não pode ser alterado.',
  },
  {
    teste: /not-null constraint|null value in column/i,
    mensagem: 'Faltam informações obrigatórias.',
  },
  {
    teste: /relation .* does not exist|column .* does not exist|could not find the table|schema cache/i,
    mensagem: 'O sistema está temporariamente indisponível. Tente novamente mais tarde.',
  },
  {
    teste: /invalid api key/i,
    mensagem: 'Falha de configuração do servidor. Tente novamente mais tarde.',
  },
  {
    teste: /failed to send a request|edge function/i,
    mensagem: 'Não foi possível conectar ao serviço. Tente novamente.',
  },
];

/**
 * Converte erros técnicos do Supabase/PostgREST em mensagens em português.
 * Mensagens que já estão em português são mantidas.
 */
export function mensagemErro(
  erro: unknown,
  fallback = 'Não foi possível concluir a operação. Tente novamente.',
): string {
  let texto = '';

  if (typeof erro === 'string') {
    texto = erro;
  } else if (erro && typeof erro === 'object') {
    const objeto = erro as ErroComMensagem;
    const codigo = typeof objeto.code === 'string' ? objeto.code : '';
    const mensagem = typeof objeto.message === 'string' ? objeto.message : '';
    texto = `${codigo} ${mensagem}`.trim();
  }

  if (!texto) return fallback;

  const regra = REGRAS.find(({ teste }) => teste.test(texto));
  if (regra) return regra.mensagem;

  if (parecePortugues(texto)) return texto;

  return fallback;
}

function parecePortugues(texto: string): boolean {
  return (
    /[áàâãéêíóôõúç]/i.test(texto) ||
    /\b(não|verifique|tente|falha|sessão|usuário|senha|conexão|e-mail|conta|mala|voo|demorou)\b/i.test(
      texto,
    )
  );
}
