import React from 'react'
import CommonItemBoxBottom, {
    ItemBoxBottomProps,
} from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'
import ProfilePopupContainer, {
    ProfilePopupProps,
} from '../../features/user-management/ui/containers/profile-popup-container'

export default function ItemBoxBottom(
    props: ItemBoxBottomProps & { profilePopupProps?: ProfilePopupProps },
) {
    const renderWithPopup: ItemBoxBottomProps['renderCreationInfo'] = ({
        children,
    }) => (
        <ProfilePopupContainer {...props.profilePopupProps!}>
            {children}
        </ProfilePopupContainer>
    )
    const renderWithoutPopup: ItemBoxBottomProps['renderCreationInfo'] = ({
        children,
    }) => children

    return (
        <CommonItemBoxBottom
            {...props}
            renderCreationInfo={
                props.profilePopupProps ? renderWithPopup : renderWithoutPopup
            }
        />
    )
}
