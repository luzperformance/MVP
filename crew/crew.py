import os
from crewai import Agent, Task, Crew, Process, LLM
from crewai.project import CrewBase, agent, task, crew
from crewai_tools import FileReadTool, FileWriteTool, DirectoryReadTool


@CrewBase
class ProntuarioCrew:
    """
    Crew responsável por construir o sistema de Prontuário LuzPerformance.
    Analisa o estado atual, implementa features faltantes e garante segurança LGPD.
    """

    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    def __init__(self):
        self.llm = LLM(
            model="claude-opus-4-6",
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0.1,
        )
        self.read_tool = FileReadTool()
        self.write_tool = FileWriteTool()
        self.dir_tool = DirectoryReadTool()

    # ── Agents ──────────────────────────────────────────────────────────────

    @agent
    def analista(self) -> Agent:
        return Agent(
            config=self.agents_config['analista'],
            tools=[self.read_tool, self.dir_tool],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
        )

    @agent
    def auth_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['auth_agent'],
            tools=[self.read_tool, self.write_tool],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
        )

    @agent
    def backend_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['backend_agent'],
            tools=[self.read_tool, self.write_tool, self.dir_tool],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
        )

    @agent
    def frontend_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['frontend_agent'],
            tools=[self.read_tool, self.write_tool, self.dir_tool],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
        )

    @agent
    def react_performance_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['react_performance_agent'],
            tools=[self.read_tool, self.write_tool],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
        )

    @agent
    def qa_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['qa_agent'],
            tools=[self.read_tool, self.write_tool],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
        )

    # ── Tasks ────────────────────────────────────────────────────────────────

    @task
    def analyze_task(self) -> Task:
        return Task(config=self.tasks_config['analyze_task'])

    @task
    def auth_task(self) -> Task:
        return Task(config=self.tasks_config['auth_task'])

    @task
    def backend_task(self) -> Task:
        return Task(config=self.tasks_config['backend_task'])

    @task
    def frontend_task(self) -> Task:
        return Task(config=self.tasks_config['frontend_task'])

    @task
    def react_performance_task(self) -> Task:
        return Task(config=self.tasks_config['react_performance_task'])

    @task
    def qa_task(self) -> Task:
        return Task(config=self.tasks_config['qa_task'])

    # ── Crew ─────────────────────────────────────────────────────────────────

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
