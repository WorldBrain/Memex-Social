import React from 'react'

export function keyPressAction(e: React.KeyboardEvent<HTMLElement>) {
    if (e.which === 13 || e.keyCode === 13 || e.key === 'Enter') {
        if (e.ctrlKey || e.metaKey) {
            return 'confirm'
        }
    }
    if (e.key === 'Escape') {
        return 'cancel'
    }
    return null
}
