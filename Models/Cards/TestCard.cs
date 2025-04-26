using System.ComponentModel.DataAnnotations;

namespace Crux.Models.Cards;

public class TestCard : Card
{
    public ICollection<Question> Questions { get; set; } = new List<Question>();
}
