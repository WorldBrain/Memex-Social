import { DETECTION_EL_ID } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'

export const isMemexInstalled = () => {
    if (document.getElementById(DETECTION_EL_ID)) {
        return true
    } else {
        return false
    }
}
