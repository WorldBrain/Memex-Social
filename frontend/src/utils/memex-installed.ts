export const isMemexInstalled = () => {
    if (document.getElementById('__memex-ext-installed-detection-element')) {
        return true
    } else {
        return false
    }
}
