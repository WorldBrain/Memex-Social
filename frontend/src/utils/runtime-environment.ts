export function determineEnv(): 'staging' | 'production' | 'testing' {
    const { NODE_ENV, REACT_APP_FIREBASE_PROJECT_ID } = process.env
    if (
        REACT_APP_FIREBASE_PROJECT_ID === 'worldbrain-staging' ||
        NODE_ENV === 'development'
    ) {
        return 'staging'
    }
    if (
        REACT_APP_FIREBASE_PROJECT_ID === 'worldbrain-1057' ||
        NODE_ENV === 'production'
    ) {
        return 'production'
    }
    return 'testing'
}
