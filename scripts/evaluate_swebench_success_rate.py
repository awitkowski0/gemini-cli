import re
from pathlib import Path
import json

import typer

app = typer.Typer()


def get_metrics_from_summary(summary_path: Path) -> dict[str, float]:
    """
    Parses the summary_stats.md file to get evaluation metrics.
    """
    metrics = {}
    content = summary_path.read_text()

    resolved_match = re.search(r"Resolved:\s*(\d+)\s*/\s*(\d+)\s*(\d+\.\d+)%", content)
    if resolved_match:
        metrics["resolved_count"] = int(resolved_match.group(1))
        metrics["resolved_total"] = int(resolved_match.group(2))
        metrics["success_rate"] = float(resolved_match.group(3))

    # Add more metric parsing here if needed, for example:
    # recall_match = re.search(r"Average recall:\s*(\d+\.\d+)", content)
    # if recall_match:
    #     metrics["avg_recall"] = float(recall_match.group(1))

    return metrics


@app.command()
def main(
    experiment_dir: str = typer.Option(..., help="Directory of the experiment. Should contain artifacts/summary_stats.md"),
):
    """
    Evaluates the success rate from a SWE-bench experiment run.
    """
    summary_path = Path(experiment_dir) / "artifacts" / "summary_stats.md"
    if not summary_path.exists():
        print(f"Error: Summary file not found at {summary_path}")
        raise typer.Exit(1)

    metrics = get_metrics_from_summary(summary_path)

    if not metrics:
        print(f"Error: Could not parse any metrics from {summary_path}")
        raise typer.Exit(1)

    print("SWE-bench Evaluation Results:")
    if "success_rate" in metrics:
        print(f"  Success Rate: {metrics['success_rate']:.2f}% ({metrics['resolved_count']}/{metrics['resolved_total']})")

    # Pretty print all metrics as JSON
    print("\nMetrics (JSON):")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    app()
