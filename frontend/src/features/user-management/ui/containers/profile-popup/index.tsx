import PublicProfile from '../../components/public-profile'
import CuratorSupportButtonBlock from '../curator-support-button-block'
                {profileTaskState === 'running' && <LoadingScreen />}
                {(profileTaskState === 'pristine' ||
                    profileTaskState === 'success') && (
                    <PublicProfile
                        user={this.state.user}
                        webLinksArray={this.state.webLinksArray}
                        profileData={profileData}
                    />
                )}
                {profileData.paymentPointer && (
                    <CuratorSupportButtonBlock
                        services={this.props.services}
                        storage={this.props.storage}
                        paymentPointer={profileData.paymentPointer}
                    />
                )}
