namespace Crux.Models.Responses;

public class UserFeedResponse : Response
{
    public string? Title { get; set; }
    
    public string? Url { get; set; }
    
    public string? Description { get; set; }
    
    public string? Thumbnail { get; set; }
}
