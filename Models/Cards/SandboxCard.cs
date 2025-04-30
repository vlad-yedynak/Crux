namespace Crux.Models.Cards;

public class SandboxCard : Card
{
    public ICollection<Task> Tasks { get; set; } = new List<Task>();
}
