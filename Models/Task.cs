using Crux.Models.Cards;

namespace Crux.Models;

public class Task
{
    public int Id { get; set; }
    
    public required string Name { get; set; }
    
    public required string Description { get; set; }
    
    public int Points { get; set; }
    
    public ICollection<ExpectedTaskData> ExpectedData { get; set; } = new List<ExpectedTaskData>();

    public ICollection<ActualTaskData> ActualData { get; set; } = new List<ActualTaskData>();
    
    public int SandboxCardId { get; set; }
    
    public SandboxCard? SandboxCard { get; set; }
}
