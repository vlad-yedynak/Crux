using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class LessonResponse : Response
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }
    
    [JsonPropertyName("title")]
    public string? Title { get; set; }
    
    [JsonPropertyName("cards")]
    public ICollection<KeyValuePair<int, CardResponse>>? Cards { get; set; }
}
