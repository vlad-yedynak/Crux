using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Crux.Models.Entities;

namespace Crux.Models.Requests;

public class ValidateTaskRequest
{
    
    [Required]
    [JsonPropertyName("taskId")]
    public required int TaskId { get; set; }

    [Required]
    [JsonPropertyName("inputData")]
    public required ICollection<TaskData> InputData { get; set; }
}
