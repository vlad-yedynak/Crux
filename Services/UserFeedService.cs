using Crux.Models.Responses;

namespace Crux.Services;

public class UserFeedService : IUserFeedService
{
    public Task<ICollection<UserFeedResponse>> GetLearningResourcesAsync(string detailedTopic, int numberOfResourcesToRequest = 3)
    {
        throw new NotImplementedException();
    }
}
