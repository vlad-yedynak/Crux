using Crux.Models.Entities;
using Crux.Models.EntityTypes;

namespace Crux.Models.Cards;

public class SandboxCard : Card
{
    public SandboxCardType Type { get; set; }
    
    public ICollection<Entities.Task> Tasks { get; set; } = new List<Entities.Task>();
}
