using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class FullCardResponse : BriefCardResponse
{
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    
    [JsonPropertyName("questions")]
    public ICollection<QuestionResponse>? Questions { get; set; }
    
    [JsonPropertyName("tasks")]
    public ICollection<TaskResponse>? Tasks { get; set; }
    
    [JsonPropertyName("sandboxType")]
    public string? SandboxType { get; set; }
}
