import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import React from 'react'
import styled from 'styled-components'
import { Margin } from 'styled-components-spacing'
import { HoverBox } from '../../../../common-ui/components/hoverbox'

import { theme } from '../../../../main-ui/styles/theme'

const MenuItem = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    border-radius: 8px;
    padding: 0 15px;
    height: 50px;
    width: 100%;
    grid-gap: 10px;

    &:hover {
        background: ${(props) => props.theme.colors.backgroundColorDarker};
    }
`

const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    width: 30px;
`

const MenuItemText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    font-weight: 400;
`

const BetaDisclaimer = styled(Margin)`
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 12px;
    display: flex;
    justify-content: center;
    text-align: center;
    border-top: 1px solid #e0e0e0;
    padding: 10px 20px;
`

const ContentBox = styled.div`
    display: flex;
    padding: 10px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
`

export default function AuthMenu(props: {
    onSettingsRequested(): void
    onLogoutRequested(): void
    onAccountSettingsRequested(): void
}) {
    return (
        <HoverBox right="0px" padding="0px" width="270px">
            <ContentBox>
                <AuthMenuItem
                    label={'Settings'}
                    onClick={props.onAccountSettingsRequested}
                    icon={theme.icons.settings}
                />
                <AuthMenuItem
                    label={'Logout'}
                    icon={theme.icons.personFine}
                    onClick={props.onLogoutRequested}
                />
                <AuthMenuItem
                    label={'Feature Requests & Bugs'}
                    icon={theme.icons.sadFace}
                    onClick={() => window.open('https://memex.garden/feedback')}
                />
            </ContentBox>
        </HoverBox>
    )
}

function AuthMenuItem(props: { label: string; icon?: any; onClick(): void }) {
    return (
        <MenuItem onClick={props.onClick}>
            <IconContainer>
                <Icon icon={props.icon} heightAndWidth="18px" hoverOff />
            </IconContainer>
            <MenuItemText>{props.label}</MenuItemText>
        </MenuItem>
    )
}
