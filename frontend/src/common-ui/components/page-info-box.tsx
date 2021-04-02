import React from 'react'
import CommonPageInfoBox, {
    PageInfoBoxProps,
    PageInfoBoxAction,
} from '@worldbrain/memex-common/lib/common-ui/components/page-info-box'
import { ProfilePopupContainerDependencies } from '../../features/user-management/ui/containers/profile-popup-container/types'
import CreationInfo from './creation-info'

export type { PageInfoBoxAction }

export default function PageInfoBox(
    props: PageInfoBoxProps & {
        profilePopup?: ProfilePopupContainerDependencies | null
    },
) {
    return (
        <CommonPageInfoBox
            {...props}
            renderCreationInfo={(creationInfoProps) => (
                <CreationInfo
                    {...creationInfoProps}
                    profilePopup={props.profilePopup}
                />
            )}
        />
    )
}
