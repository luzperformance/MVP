import os
import sys
from crewai import Agent, Task, Crew, Process

# Define Agents
frontend_agent = Agent(
    role="Frontend UI Auditor",
    goal="Verify React Calendar UI components",
    backstory="You are an expert React developer responsible for auditing UI implementation of the Native Google Calendar integration.",
    verbose=True,
    allow_delegation=False
)

backend_agent = Agent(
    role="Backend Systems Auditor",
    goal="Verify OAuth2 and Calendar Route implementations",
    backstory="You are a senior Node.js backend engineer auditing out OAuth2 logic and Google API integrations.",
    verbose=True,
    allow_delegation=False
)

database_agent = Agent(
    role="Database Migrations Auditor",
    goal="Verify DB schema updates for OAuth tokens",
    backstory="You are a seasoned DBA checking for the existence of `google_tokens` in the database schemas context.",
    verbose=True,
    allow_delegation=False
)

integration_agent = Agent(
    role="Integration Auditor",
    goal="Verify frontend and backend components are stitched together correctly in patient dashboards",
    backstory="You are an integration testing specialist ensuring that the `ScheduleConsultaButton` was successfully integrated into patient views.",
    verbose=True,
    allow_delegation=False
)

# Define Tasks
task_frontend = Task(
    description="Analyze the frontend codebase (shared/types.ts, CalendarGrid.tsx, EventFormModal.tsx, ScheduleConsultaButton.tsx) and report if they implement the native calendar requirements.",
    expected_output="A frontend audit report confirming the files are present and match requirements.",
    agent=frontend_agent
)

task_backend = Task(
    description="Analyze the backend codebase (googleCalendar.ts, calendar.ts) for Google Calendar OAuth integration and event creation methods.",
    expected_output="A backend audit report detailing the health of the OAuth endpoints and token refreshment logic.",
    agent=backend_agent
)

task_database = Task(
    description="Analyze database.ts for the presence of doctor.google_tokens schema configurations.",
    expected_output="A database sanity check report.",
    agent=database_agent
)

task_integration = Task(
    description="Check PatientDetailPage.tsx and NewRecordPage.tsx for usage of ScheduleConsultaButton or similar calendar integration pieces.",
    expected_output="An integration summary detailing the connectivity of the components.",
    agent=integration_agent
)

# Define Crew
calendar_audit_crew = Crew(
    agents=[frontend_agent, backend_agent, database_agent, integration_agent],
    tasks=[task_frontend, task_backend, task_database, task_integration],
    process=Process.sequential, # Since parallel is subject to OpenAI API limits, we default to sequential, but conceptually they are parallel analysis roles.
    verbose=True
)

if __name__ == "__main__":
    print("Starting CrewAI Validation for Calendar Integration...")
    # NOTE: Run this script with OPENAI_API_KEY set.
    # result = calendar_audit_crew.kickoff()
    # print("######################")
    # print("AUDIT RESULT:")
    # print(result)
    print("Crew Agents configured successfully. Provide an LLM API key to kickoff the tasks.")
