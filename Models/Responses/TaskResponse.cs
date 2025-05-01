using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class TaskResponse : Response
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }
    
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    
    [JsonPropertyName("points")]
    public int? Points { get; set; }
}
