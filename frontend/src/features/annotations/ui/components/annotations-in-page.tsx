import React from 'react'
import AnnotsInPage, {
    AnnotationsInPageProps as Props,
} from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotations-in-page'

import ProfilePopupContainer, {
    ProfilePopupProps,
} from '../../../user-management/ui/containers/profile-popup-container'

export type { Props }

const AnnotationsInPage = ({
    profilePopupProps,
    ...props
}: Omit<Props, 'renderCreationInfo'> & {
    profilePopupProps?: Omit<ProfilePopupProps, 'userRef'>
}) => (
    console.log('AnnotationsInPage', props.openImageInPreview),
    (
        <AnnotsInPage
            {...props}
            renderCreationInfo={(userRef) => ({ children }) => (
                <ProfilePopupContainer
                    {...profilePopupProps!}
                    userRef={userRef}
                >
                    {children}
                </ProfilePopupContainer>
            )}
        />
    )
)

export default AnnotationsInPage
