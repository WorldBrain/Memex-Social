import moment from 'moment'
import React from 'react'
import styled from 'styled-components'
import { Margin } from 'styled-components-spacing'
import UserAvatar from './user-avatar'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'

const StyledCreationInfo = styled.div`
    display: flex;
`

const AvatarHolder = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`

const Details = styled.div`
    display: flex;
    align-items: center;
`

const Creator = styled.div`
    font-weight: 600;
    color: ${(props) => props.theme.colors.primary};
    font-size: 12px;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`
const CreationDate = styled.div`
    font-family: 'Poppins';
    font-weight: normal;
    font-size: 11px;
    color: ${(props) => props.theme.colors.primary};
    padding-left: 10px;
`

export interface CreationInfoProps {
    createdWhen?: number
    creator?: Pick<User, 'displayName'> | null
}

export default function CreationInfo(props: CreationInfoProps) {
    return (
        <StyledCreationInfo>
            {/*<AvatarHolder>
        <Margin right="small">
          <UserAvatar user={props.creator} loading={!props.creator} />
        </Margin>
      </AvatarHolder>
    */}
            <Details>
                <Creator>
                    {props.creator?.displayName ?? <span>&nbsp;</span>}
                </Creator>
                <CreationDate>
                    {props.createdWhen ? (
                        moment(props.createdWhen).format('LLL')
                    ) : (
                        <span>&nbsp;</span>
                    )}
                </CreationDate>
            </Details>
        </StyledCreationInfo>
    )
}
