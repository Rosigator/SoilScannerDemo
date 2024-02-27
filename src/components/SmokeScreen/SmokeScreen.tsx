'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './SmokeScreen.module.scss';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

interface SmokeScreenProps {
    show: boolean
}

export const SmokeScreen = ({show}: SmokeScreenProps) => {
    return (
        <section className={`${styles.SmokeScreen} ${show ? '' : styles.hidden}`}>
            <FontAwesomeIcon icon={faSpinner} spin />
        </section>
    )
}
