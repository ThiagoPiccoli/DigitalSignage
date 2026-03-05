interface NomeProps {
  aluno: string;
}

function Nome({ aluno }: NomeProps) {
  return <span>{aluno}</span>;
}

export default Nome;
