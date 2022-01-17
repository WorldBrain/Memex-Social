export const isMemexInstalled = () => {
    if (document.getElementById('memex-ribbon-container')) {
        return true
    } else {
        return false
    }
}
