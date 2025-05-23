using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class LessonResponse : Response
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }
    
    [JsonPropertyName("title")]
    public string? Title { get; set; }
    
    [JsonPropertyName("totalPoints")]
    public int TotalPoints { get; set; }
    
    [JsonPropertyName("cards")]
    public ICollection<BriefCardResponse>? BriefCards { get; set; }
}
