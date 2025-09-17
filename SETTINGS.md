# Configurações da Conta - Jira Assistant

## Visão Geral

O sistema de configurações permite aos usuários gerenciar suas chaves de API e credenciais necessárias para integração com serviços externos como OpenAI e JIRA. Todas as configurações são criptografadas e armazenadas de forma segura no banco de dados.

## Configurações Disponíveis

### 1. OpenAI API Key
- **Chave:** `openai-api-key`
- **Descrição:** Chave necessária para utilizar os recursos de IA do ChatGPT e outros modelos
- **Formato:** Deve começar com `sk-proj-` ou `sk-`
- **Obrigatório:** Sim
- **Exemplo:** `sk-proj-abc123...`

### 2. JIRA Base URL
- **Chave:** `jira-base-url`
- **Descrição:** URL da sua instância do JIRA
- **Formato:** URL válida (https)
- **Obrigatório:** Não
- **Exemplo:** `https://sua-empresa.atlassian.net`

### 3. JIRA Email
- **Chave:** `jira-email`
- **Descrição:** Seu email cadastrado no JIRA para autenticação
- **Formato:** Email válido
- **Obrigatório:** Não
- **Exemplo:** `seu-email@empresa.com`

### 4. JIRA API Token
- **Chave:** `jira-api-key`
- **Descrição:** Token de API para acessar o JIRA
- **Formato:** String alfanumérica
- **Obrigatório:** Não
- **Exemplo:** `ATATT3xFfGF0...`

## Funcionalidades

### Gerenciamento de Configurações
- **Criar/Atualizar:** Adicionar ou modificar configurações existentes
- **Visualizar:** Ver configurações com valores mascarados para segurança
- **Remover:** Deletar configurações desnecessárias
- **Validar:** Testar conectividade com APIs externas

### Segurança
- **Criptografia:** Todas as configurações são criptografadas antes do armazenamento
- **Mascaramento:** Valores sensíveis são mascarados na interface
- **Validação:** Verificação de formato e autenticidade das chaves

### Validação de APIs
- **OpenAI:** Testa conexão com a API da OpenAI
- **JIRA:** Valida credenciais e conectividade com JIRA
- **URL:** Verifica se URLs são válidas e acessíveis
- **Relatório:** Status visual de todas as configurações

## Estrutura de Arquivos

```
jira-assistant/
├── app/api/settings/
│   └── route.ts                    # API endpoints para CRUD de configurações
├── components/settings/
│   ├── settings-form.tsx           # Formulário principal de configurações
│   └── api-validator.tsx           # Componente de validação de APIs
├── hooks/
│   └── use-settings.ts             # Hook para gerenciar estado das configurações
├── lib/
│   ├── settings/
│   │   └── enum.ts                 # Definição das chaves de configuração
│   └── utils/
│       └── encryption.ts           # Utilitários de criptografia
└── SETTINGS.md                     # Esta documentação
```

## APIs

### GET /api/settings
Busca todas as configurações do usuário autenticado.

**Resposta:**
```json
{
  "success": true,
  "settings": {
    "openai-api-key": "sk-...xyz4",
    "jira-base-url": "https://empresa.atlassian.net",
    "jira-email": "user@empresa.com",
    "jira-api-key": "***...abc4"
  }
}
```

### PUT /api/settings
Atualiza uma ou mais configurações.

**Payload:**
```json
{
  "openai-api-key": "sk-proj-new-key",
  "jira-base-url": "https://nova-url.atlassian.net"
}
```

### DELETE /api/settings?key={setting_key}
Remove uma configuração específica.

**Parâmetros:**
- `key`: Chave da configuração a ser removida

## Hook useSettings

### Propriedades Retornadas
- `settings`: Objeto com todas as configurações
- `isLoading`: Estado de carregamento
- `error`: Mensagem de erro, se houver
- `updateSetting(key, value)`: Função para atualizar uma configuração
- `removeSetting(key)`: Função para remover uma configuração
- `refetch()`: Função para recarregar configurações
- `isSettingConfigured(key)`: Verifica se uma configuração existe

### Exemplo de Uso
```tsx
const { settings, updateSetting, isSettingConfigured } = useSettings();

// Verificar se OpenAI está configurado
const hasOpenAI = isSettingConfigured(Settings.OpenaiApiKey);

// Atualizar configuração
await updateSetting(Settings.JiraBaseUrl, "https://nova-url.atlassian.net");
```

## Componentes

### SettingsForm
Componente principal para gerenciar todas as configurações.

**Características:**
- Formulário responsivo com validação
- Mascaramento de valores sensíveis
- Botões individuais para salvar/remover
- Links para documentação de APIs
- Status visual das configurações

### ApiValidator
Componente para validar conectividade com APIs externas.

**Funcionalidades:**
- Teste individual de cada API
- Validação em lote de todas as configurações
- Feedback visual do status de conectividade
- Relatório de estatísticas de validação

## Criptografia

### Algoritmo
- **Método:** AES-256-CBC
- **Chave:** Definida na variável de ambiente `ENCRYPTION_KEY`
- **IV:** Gerado aleatoriamente para cada operação

### Funções Principais
- `encrypt(text)`: Criptografa um texto
- `decrypt(encryptedData)`: Descriptografa dados
- `maskSensitiveValue(value)`: Mascara valores para exibição
- `encryptSettings(settings)`: Criptografa objeto de configurações
- `decryptSettings(settings)`: Descriptografa objeto de configurações

## Validações

### Formato das Chaves
- **OpenAI:** Deve começar com `sk-` e ter mais de 20 caracteres
- **JIRA Token:** Deve ter mais de 10 caracteres
- **Email:** Formato de email válido
- **URL:** URL válida com protocolo HTTPS

### Conectividade
- **OpenAI:** Testa endpoint `/v1/models`
- **JIRA:** Testa endpoint `/rest/api/3/myself`
- **URL:** Verificação de acessibilidade básica

## Segurança

### Boas Práticas Implementadas
- Criptografia de dados sensíveis em repouso
- Mascaramento de valores na interface
- Validação de entrada rigorosa
- Sanitização de logs para evitar vazamento
- Chaves de criptografia via variáveis de ambiente

### Recomendações
- Use chaves de API com escopo limitado
- Monitore uso das APIs regularmente
- Mantenha tokens atualizados
- Configure variável `ENCRYPTION_KEY` em produção

## Troubleshooting

### Problemas Comuns

**Erro: "Chave da API OpenAI inválida"**
- Verifique se a chave começa com `sk-`
- Confirme que a chave não expirou
- Teste a chave diretamente no OpenAI Dashboard

**Erro: "Configurações do JIRA incompletas"**
- Configure URL, email e token juntos
- Use o formato correto da URL Atlassian
- Gere um novo API Token no JIRA

**Erro: "Failed to decrypt data"**
- Variável `ENCRYPTION_KEY` pode ter mudado
- Dados podem estar corrompidos
- Remova e reconfigure as configurações afetadas

### Logs
Os logs são automaticamente sanitizados para remover informações sensíveis. Procure por:
- `Erro ao atualizar configurações`
- `Erro ao buscar configurações`
- `Encryption/Decryption error`

## Variáveis de Ambiente

```env
# Obrigatória - Chave para criptografia (32 caracteres hex recomendado)
ENCRYPTION_KEY=sua-chave-super-segura-de-32-chars

# Opcionais - Para desenvolvimento
NODE_ENV=development
```

## Migração e Backup

### Backup das Configurações
```sql
-- Backup da tabela user_setting
SELECT * FROM user_setting WHERE userId = 'user-id';
```

### Migração entre Ambientes
1. Exporte configurações do ambiente origem
2. Configure `ENCRYPTION_KEY` no destino
3. Importe dados criptografados
4. Teste validação de APIs

## Changelog

### v1.0.0
- Sistema básico de configurações
- Criptografia AES-256-CBC
- Interface de gerenciamento
- Validação de APIs OpenAI e JIRA
- Documentação completa