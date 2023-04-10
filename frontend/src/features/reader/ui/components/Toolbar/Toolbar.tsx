import React, { useState } from 'react'

import { ToolbarWrapper } from './ToolbarStyled'

const Toolbar = () => {
    const [example, setExample] = useState(false)

    return (
        <ToolbarWrapper>
            <p>Example text</p>
        </ToolbarWrapper>
    )
}

export default Toolbar
