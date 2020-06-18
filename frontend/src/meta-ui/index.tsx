import * as history from 'history'
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './styles.module.scss'

// import { Services } from '../services/types';
// import { Storage } from '../storage/types';

export default async function runMetaUi(options : { history : history.History, scenarioPrograms : Array<{
    run: (element : Element) => void,
    description? : string
}> }) {
    ReactDOM.render((
        <React.Fragment>
            <div className={styles.stepsContainer}>
                {options.scenarioPrograms.map((program, programIndex) => 
                    <div key={programIndex} className={styles.stepContainer}>
                        <div className={styles.stepTitle}>{program.description || <span>&nbsp;</span>}</div>
                        <div
                            className={styles.programContainer}
                            style={{width: '360px', height: '640px'}}
                            ref={element => {
                                if (!element) {
                                    throw new Error(`React didn't give an element for program container`)
                                }
                                program.run(element)
                            }}
                        />
                    </div>
                )}
            </div>
        </React.Fragment>
    ), document.getElementById('root'))
}
