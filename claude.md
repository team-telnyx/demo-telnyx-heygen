# Global Claude Instructions

## Core Behaviors
- Always check for project-specific instructions first
- Use appropriate MCP servers based on task type
- Generate outputs in designated output folders
- Maintain consistent formatting across projects
- Use /init to analyze all files when starting new sessions

## Workflow Methodology
1. **Explore** → **Plan** → **Code** → **Commit**
2. Use Test-Driven Development approach
3. Take screenshots for visual feedback and iteration
4. Use subagents for complex planning tasks

## Default Output Preferences
- PDFs: Use professional formatting with headers/footers
- Markdown: Include table of contents for longer documents
- Always create both working version and final version

## MCP Server Priorities
1. File management for document operations
2. Web search for research tasks
3. Playwright for browser automation
4. Database connections for data projects
