# Página de Perfil - Jira Assistant

## Visão Geral

A página de perfil permite aos usuários gerenciar suas informações pessoais, foto de perfil e configurações de segurança da conta. Esta funcionalidade foi implementada usando React, TypeScript, Next.js e Better Auth.

## Funcionalidades

### 1. Informações do Perfil
- **Visualização e edição do nome** do usuário
- **Visualização do email** (somente leitura)
- **Status de verificação do email**
- **Datas de criação e última atualização** da conta

### 2. Foto de Perfil
- **Upload de imagem** com drag & drop
- **Preview em tempo real** da imagem selecionada
- **Validação de tipo de arquivo** (JPG, PNG, WebP)
- **Validação de tamanho** (máximo 5MB)
- **Remoção de foto** de perfil
- **Fallback com iniciais** quando não há foto

### 3. Alteração de Senha
- **Formulário seguro** para mudança de senha
- **Validação de senha atual**
- **Indicador de força** da nova senha
- **Confirmação de senha** obrigatória
- **Critérios de segurança** (mínimo 8 caracteres, letras maiúsculas/minúsculas, números)

### 4. Status da Conta
- **Indicadores visuais** do status da conta
- **Verificação de email** pendente/concluída
- **Estatísticas da conta** (ano de cadastro, dias conosco, completude do perfil)

## Estrutura de Arquivos

```
jira-assistant/
├── app/
│   ├── (app)/profile/
│   │   └── page.tsx                    # Página principal de perfil
│   └── api/profile/
│       ├── route.ts                    # API para CRUD do perfil
│       └── upload/
│           └── route.ts                # API para upload de imagens
├── components/profile/
│   ├── image-upload.tsx                # Componente de upload de imagem
│   ├── password-reset-form.tsx         # Formulário de alteração de senha
│   └── profile-form.tsx                # Formulário principal do perfil
├── hooks/
│   └── use-profile.ts                  # Hook personalizado para gerenciar estado
├── lib/utils/
│   └── file-upload.ts                  # Utilitários para upload de arquivos
└── public/uploads/
    └── avatars/                        # Diretório para armazenar avatars
```

## APIs Implementadas

### GET /api/profile
Retorna as informações do perfil do usuário autenticado.

**Resposta:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "image": "string|null",
    "emailVerified": boolean,
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### PUT /api/profile
Atualiza as informações do perfil do usuário.

**Payload:**
```json
{
  "name": "string (opcional)",
  "image": "string (opcional)"
}
```

### POST /api/profile/upload
Faz upload de uma imagem de perfil.

**Payload:** FormData com arquivo
**Resposta:**
```json
{
  "success": true,
  "imageUrl": "string"
}
```

## Componentes

### ImageUpload
Componente responsável pelo upload e gerenciamento da foto de perfil.

**Props:**
- `currentImage?: string | null` - URL da imagem atual
- `onImageChange: (imageUrl: string) => void` - Callback para mudança de imagem
- `userName?: string` - Nome do usuário para fallback
- `disabled?: boolean` - Desabilita interações

**Características:**
- Validação de tipo e tamanho de arquivo
- Preview em tempo real
- Interface drag & drop
- Fallback com iniciais do usuário

### PasswordResetForm
Formulário para alteração de senha com validações de segurança.

**Props:**
- `disabled?: boolean` - Desabilita o formulário

**Características:**
- Validação de senha atual via Better Auth
- Indicador visual de força da senha
- Critérios de segurança rigorosos
- Confirmação de senha obrigatória

### ProfileForm
Formulário principal para edição das informações do perfil.

**Props:**
- `user: User` - Dados do usuário
- `onUpdate?: (updatedUser: Partial<User>) => void` - Callback para atualizações
- `disabled?: boolean` - Desabilita o formulário

## Hook Personalizado

### useProfile()
Hook para gerenciar o estado e operações do perfil do usuário.

**Retorna:**
- `user: User | null` - Dados do usuário
- `isLoading: boolean` - Estado de carregamento
- `error: string | null` - Mensagem de erro
- `refetch: () => Promise<void>` - Recarrega os dados
- `updateUser: (updates: Partial<User>) => void` - Atualiza estado local

## Validações

### Upload de Arquivos
- **Tipos permitidos:** JPG, JPEG, PNG, WebP
- **Tamanho máximo:** 5MB
- **Validação no frontend e backend**

### Senhas
- **Mínimo:** 8 caracteres
- **Obrigatório:** Pelo menos 1 letra minúscula, 1 maiúscula, 1 número
- **Força:** Indicador visual com 5 níveis

## Segurança

- **Autenticação obrigatória** para todas as operações
- **Validação de sessão** em todas as APIs
- **Sanitização de uploads** de arquivo
- **Validação de dados** com Zod
- **Senhas hasheadas** via Better Auth

## UX/UI

- **Design responsivo** com Tailwind CSS
- **Componentes acessíveis** do Radix UI
- **Feedback visual** com toast notifications
- **Estados de loading** e error
- **Confirmações visuais** para ações importantes

## Dependências Principais

- **Better Auth** - Autenticação e gerenciamento de usuários
- **Prisma** - ORM para banco de dados
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de esquemas
- **Sonner** - Toast notifications
- **Lucide React** - Ícones
- **Tailwind CSS** - Estilização

## Como Usar

1. **Acesse a página:** Navegue para `/profile` após fazer login
2. **Altere informações:** Edite nome e foto de perfil
3. **Mude a senha:** Use o formulário de segurança
4. **Visualize status:** Confira informações da conta e estatísticas

## Melhorias Futuras

- [ ] Integração com serviço de email para verificação
- [ ] Compressão automática de imagens
- [ ] Upload via drag & drop na área de foto
- [ ] Histórico de alterações de perfil
- [ ] Autenticação de dois fatores
- [ ] Backup e restauração de dados
- [ ] Temas personalizados por usuário