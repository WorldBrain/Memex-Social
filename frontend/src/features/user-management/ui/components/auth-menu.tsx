import React from 'react'
import styled from 'styled-components'
import { Margin } from 'styled-components-spacing'

const StyledAuthMenu = styled.div`
    background: ${(props) => props.theme.colors.background};
    box-shadow: 0px 0px 4.19178px rgba(0, 0, 0, 0.14);
    border-radius: 3px;
`

const MenuItem = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 5px 20px;

    &:hover {
        background: ${(props) => props.theme.colors.grey};
    }
`
const MenuItemText = styled.div`
   font-family: ${(props) => props.theme.fonts.primary};
   font-size: 14px;
   font-weight: 600;
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


export default function AuthMenu(props: {
    onSettingsRequested(): void
    onLogoutRequested(): void
    onAccountSettingsRequested(): void
}) {
    return (
        <StyledAuthMenu>
            {/*<AuthMenuItem
        label={"Settings"}
        onClick={props.onSettingsRequested}
      />*/}
            <AuthMenuItem
                label={'Account Settings'}
                onClick={props.onAccountSettingsRequested}
            />
            <AuthMenuItem label={'Logout'} onClick={props.onLogoutRequested} />
            <AuthMenuItem label={'Feedback'} onClick={()=>window.open('https://worldbrain.io/feedback')} />
            <BetaDisclaimer top="small">Memex.Social is in Beta. <br/> Feedback and use cases welcome</BetaDisclaimer>
        </StyledAuthMenu>
    )
}

function AuthMenuItem(props: {
    label: string
    icon?: string
    onClick(): void
}) {
    return (
        <Margin vertical={'smallest'}>
            <MenuItem onClick={props.onClick}>
                <MenuItemText>{props.label}</MenuItemText>
            </MenuItem>
        </Margin>
    )
}
