import CuratorSupportButtonBlock from '../curator-support-button-block'
                {profileData.paymentPointer && (
                    <CuratorSupportButtonBlock
                        services={this.props.services}
                        storage={this.props.storage}
                        paymentPointer={profileData.paymentPointer}
                    />
                )}
