import React from 'react'
import CommonCreationInfo, {
    CreationInfoProps,
} from '@worldbrain/memex-common/lib/common-ui/components/creation-info'
import { ProfilePopupContainerDependencies } from '../../features/user-management/ui/containers/profile-popup-container/types'
import ProfilePopupContainer from '../../features/user-management/ui/containers/profile-popup-container'

export default function CreationInfo(
    props: CreationInfoProps & {
        profilePopup?: ProfilePopupContainerDependencies | null
    },
) {
    if (props.profilePopup) {
        return (
            <ProfilePopupContainer {...props.profilePopup}>
                <CommonCreationInfo {...props} />
            </ProfilePopupContainer>
        )
    } else {
        return <CommonCreationInfo {...props} />
    }
}
