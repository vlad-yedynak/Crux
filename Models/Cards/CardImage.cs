using System.Text.Json.Serialization;

namespace Crux.Models.Cards;

public class CardImage
{
    public int Id { get; set; }
    
    public required string Url { get; set; }
    
    public string? Caption { get; set; }
    
    public string? AltText { get; set; }
    
    [JsonIgnore]
    public EducationalCard EducationalCard { get; set; }
    
    public int EducationalCardId { get; set; }
}
