import React, { useState } from 'react'

import { SidemenuWrapper } from './SidemenuStyled'

const Sidemenu = () => {
    const [example, setExample] = useState(false)

    return (
        <SidemenuWrapper>
            <p>Example text</p>
        </SidemenuWrapper>
    )
}

export default Sidemenu
