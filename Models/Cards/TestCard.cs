using System.ComponentModel.DataAnnotations;

namespace Crux.Models.Cards;

public class TestCard : Card
{
    [Required]
    [MaxLength(255)]
    public required string Question { get; set; }
    
    [Required]
    [MaxLength(255)]
    public required string Answer { get; set; }
}
