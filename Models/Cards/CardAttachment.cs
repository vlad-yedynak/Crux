using System.Text.Json.Serialization;

namespace Crux.Models.Cards;

public class CardAttachment
{
    public int Id { get; set; }
    
    public string? Url { get; set; }
    
    public string? Description { get; set; }
    
    [JsonIgnore]
    public EducationalCard EducationalCard { get; set; }
    
    public int EducationalCardId { get; set; }
}
