import { UIEventHandler } from '../../../../../main-ui/classes/logic'
import ProfilePopupLogic from '../profile-popup-container/logic'
import {
    ProfilePopupContainerDependencies,
    ProfilePopupContainerState,
    ProfilePopupContainerEvent,
} from '../profile-popup-container/types'

export type CuratorSupportPopupContainerDependencies = ProfilePopupContainerDependencies
export type CuratorSupportPopupContainerState = ProfilePopupContainerState
export type CuratorSupportPopupContainerEvent = ProfilePopupContainerEvent

export default class CuratorSupportPopupContainerLogic extends ProfilePopupLogic {}
