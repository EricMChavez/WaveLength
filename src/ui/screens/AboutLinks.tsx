import retro from './retro-shared.module.css';

export function AboutLinks() {
  return (
    <div className={retro.screenText}>
      <div>&nbsp;</div>
      <div>{'\u2014 Eric Chavez'}</div>
      <div>&nbsp;</div>
      <div>
        {'  '}
        <a
          className={retro.crtLink}
          href="https://github.com/EricMChavez/WaveLength"
          target="_blank"
          rel="noopener noreferrer"
        >
          [GitHub]
        </a>
        {'  '}
        <a
          className={retro.crtLink}
          href="https://www.linkedin.com/in/emchavez320"
          target="_blank"
          rel="noopener noreferrer"
        >
          [LinkedIn]
        </a>
      </div>
    </div>
  );
}
