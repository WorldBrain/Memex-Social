import React, { useState, useEffect } from 'react'

function Tweet({ url }: any) {
    const [sourceUrl, setSourceUrl] = useState(url)
    const [html, setHtml] = useState(null)

    useEffect(() => {
        fetch(`https://publish.twitter.com/oembed?url=${sourceUrl}`)
            .then((response) => response.json())
            .then((data) => {
                setHtml(data.html)
            })
            .catch((error) => {
                console.error('Error', error)
            })
    }, [sourceUrl])

    return (
        <div>
            {html && <div dangerouslySetInnerHTML={{ __html: html }}></div>}
        </div>
    )
}

export default Tweet
