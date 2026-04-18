#!/usr/bin/env python3
"""
Prontuário Crew — Constrói o sistema de prontuário LuzPerformance
usando agentes CrewAI com Claude Opus.

Uso:
    python main.py                    # roda o ciclo completo
    python main.py --task analyze     # só análise
    python main.py --task auth        # só autenticação
    python main.py --task backend     # só backend
    python main.py --task frontend    # só frontend
    python main.py --task qa          # só revisão de segurança
"""
import os
import sys
import argparse
from dotenv import load_dotenv
from crew import ProntuarioCrew

load_dotenv()


def validate_env():
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key or key.startswith("sk-ant-..."):
        print("❌  ANTHROPIC_API_KEY não configurada.")
        print("    Copie .env.example para .env e adicione sua chave.")
        sys.exit(1)


def get_inputs() -> dict:
    return {
        "mvp_dir": os.getenv("MVP_DIR", r"D:\MVP"),
        "auth_ref_dir": os.getenv("AUTH_REF_DIR", r"C:\Users\luzar\Downloads\file"),
    }


def run_full(inputs: dict):
    print("\n🚀  Iniciando ciclo completo do Prontuário Crew...\n")
    result = ProntuarioCrew().crew().kickoff(inputs=inputs)
    print("\n✅  Ciclo completo concluído!\n")
    print(result)


def run_single_task(task_name: str, inputs: dict):
    """Executa apenas uma tarefa isolada."""
    from crewai import Crew, Process
    crew_obj = ProntuarioCrew()

    task_map = {
        "analyze":  (crew_obj.analyze_task(),            [crew_obj.analista()]),
        "auth":     (crew_obj.auth_task(),               [crew_obj.analista(), crew_obj.auth_agent()]),
        "backend":  (crew_obj.backend_task(),            [crew_obj.analista(), crew_obj.backend_agent()]),
        "frontend": (crew_obj.frontend_task(),           [crew_obj.analista(), crew_obj.frontend_agent()]),
        "perf":     (crew_obj.react_performance_task(),  [crew_obj.react_performance_agent()]),
        "qa":       (crew_obj.qa_task(),                 [crew_obj.qa_agent()]),
    }

    if task_name not in task_map:
        print(f"❌  Tarefa '{task_name}' inválida. Opções: {', '.join(task_map.keys())}")
        sys.exit(1)

    selected_task, agents = task_map[task_name]
    print(f"\n🎯  Executando tarefa: {task_name}\n")

    mini_crew = Crew(
        agents=agents,
        tasks=[selected_task],
        process=Process.sequential,
        verbose=True,
    )
    result = mini_crew.kickoff(inputs=inputs)
    print(f"\n✅  Tarefa '{task_name}' concluída!\n")
    print(result)


def main():
    validate_env()
    inputs = get_inputs()

    parser = argparse.ArgumentParser(description="Prontuário CrewAI Builder")
    parser.add_argument(
        "--task",
        choices=["analyze", "auth", "backend", "frontend", "perf", "qa"],
        help="Executa apenas uma tarefa específica",
    )
    args = parser.parse_args()

    print(f"📂  Projeto MVP: {inputs['mvp_dir']}")
    print(f"📂  Referências: {inputs['auth_ref_dir']}")

    if args.task:
        run_single_task(args.task, inputs)
    else:
        run_full(inputs)


if __name__ == "__main__":
    main()
