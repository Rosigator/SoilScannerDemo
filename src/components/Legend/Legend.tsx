import styles from './Legend.module.scss';

interface LegendProps {
  min: number,
  max: number,
  compound: string,
  unit: string
}

export const Legend = ({ compound, unit, min, max }: LegendProps) => {
  return (
    <main className={styles.Legend}>
      <section>
        <p>{compound}</p>
      </section>
      <section>
        <div>
          <p>{min}</p>
          <p>{unit}</p>
        </div>
        <div>
          <p>{max}</p>
          <p>{unit}</p>
        </div>
      </section>
      <section>
        <div></div>
      </section>
    </main>
  )
}
