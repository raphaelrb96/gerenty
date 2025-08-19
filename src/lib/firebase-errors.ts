
type Language = 'en' | 'pt' | 'es';

const errorMessages: Record<string, Record<Language, string>> = {
    // GENERIC
    'default': {
        en: 'An unexpected error occurred. Please try again.',
        pt: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
        es: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.'
    },

    // LOGIN & SIGNUP & PASSWORD RESET
    'auth/invalid-email': {
        en: 'The email address is not valid.',
        pt: 'O endereço de e-mail não é válido.',
        es: 'La dirección de correo electrónico no es válida.'
    },
    'auth/user-disabled': {
        en: 'This user account has been disabled.',
        pt: 'Esta conta de usuário foi desativada.',
        es: 'Esta cuenta de usuario ha sido deshabilitada.'
    },
    'auth/user-not-found': {
        en: 'No user found with this email.',
        pt: 'Nenhum usuário encontrado com este e-mail.',
        es: 'No se encontró ningún usuario con este correo electrónico.'
    },
    'auth/wrong-password': {
        en: 'Incorrect password. Please try again.',
        pt: 'Senha incorreta. Por favor, tente novamente.',
        es: 'Contraseña incorrecta. Por favor, inténtalo de nuevo.'
    },
    'auth/email-already-in-use': {
        en: 'This email is already in use by another account.',
        pt: 'Este e-mail já está em uso por outra conta.',
        es: 'Este correo electrónico ya está en uso por otra cuenta.'
    },
    'auth/weak-password': {
        en: 'The password is too weak. Please use a stronger password.',
        pt: 'A senha é muito fraca. Por favor, use uma senha mais forte.',
        es: 'La contraseña es demasiado débil. Por favor, utiliza una contraseña más segura.'
    },
    'auth/operation-not-allowed': {
        en: 'Email/password accounts are not enabled.',
        pt: 'Contas de e-mail/senha não estão habilitadas.',
        es: 'Las cuentas de correo electrónico/contraseña no están habilitadas.'
    },
    'auth/too-many-requests': {
        en: 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.',
        pt: 'O acesso a esta conta foi temporariamente desativado devido a muitas tentativas de login com falha. Você pode restaurá-lo imediatamente redefinindo sua senha ou pode tentar novamente mais tarde.',
        es: 'El acceso a esta cuenta ha sido deshabilitado temporalmente debido a muchos intentos fallidos de inicio de sesión. Puedes restaurarlo inmediatamente restableciendo tu contraseña o puedes intentarlo de nuevo más tarde.'
    },
    'auth/invalid-credential': {
        en: 'The credentials provided are incorrect.',
        pt: 'As credenciais fornecidas estão incorretas.',
        es: 'Las credenciales proporcionadas son incorrectas.'
    }
};

export function getFirebaseAuthErrorMessage(errorCode: string, lang: Language): string {
    return errorMessages[errorCode]?.[lang] || errorMessages['default'][lang];
}
