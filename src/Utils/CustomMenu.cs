using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Menu;

public interface IMenu
{
    string Title { get; }
    bool ExitButton { get; set; }
    IMenu? PrevMenu { get; set; }
    void AddItem(string text, Action<CCSPlayerController, string> callback);
    void Display(CCSPlayerController player, int page = 0);
}

public class CustomChatMenu : IMenu
{
    public string Title { get; }
    public bool ExitButton { get; set; }
    public IMenu? PrevMenu { get; set; }
    private bool _backAdded = false;

    private readonly ChatMenu _nativeMenu;

    public CustomChatMenu(string title)
    {
        Title = title;
        _nativeMenu = new ChatMenu(title);
    }

    public void AddItem(string text, Action<CCSPlayerController, string> callback)
    {
        _nativeMenu.AddMenuOption(text, (player, option) => {
            callback(player, option.Text);
        });
    }

    public void Display(CCSPlayerController player, int page = 0)
    {
        _nativeMenu.ExitButton = ExitButton;
        if (!_backAdded && PrevMenu != null)
        {
            _backAdded = true;
            _nativeMenu.AddMenuOption("⬅ Back", (p, option) => {
                PrevMenu.Display(p);
            });
        }
        CounterStrikeSharp.API.Modules.Menu.MenuManager.OpenChatMenu(player, _nativeMenu);
    }
}

public class CustomCenterHtmlMenu : IMenu
{
    public string Title { get; }
    public bool ExitButton { get; set; }
    public IMenu? PrevMenu { get; set; }
    private bool _backAdded = false;

    private readonly CenterHtmlMenu _nativeMenu;

    public CustomCenterHtmlMenu(string title, BasePlugin plugin)
    {
        Title = title;
        _nativeMenu = new CenterHtmlMenu(title, plugin);
    }

    public void AddItem(string text, Action<CCSPlayerController, string> callback)
    {
        _nativeMenu.AddMenuOption(text, (player, option) => {
            callback(player, option.Text);
        });
    }

    public void Display(CCSPlayerController player, int page = 0)
    {
        _nativeMenu.ExitButton = ExitButton;
        if (!_backAdded && PrevMenu != null)
        {
            _backAdded = true;
            _nativeMenu.AddMenuOption("⬅ Back", (p, option) => {
                PrevMenu.Display(p);
            });
        }
        CounterStrikeSharp.API.Modules.Menu.MenuManager.OpenCenterHtmlMenu(Plugin.Instance, player, _nativeMenu);
    }
}

public static class CustomMenuManager
{
    public static IMenu MenuByType(string menuType, string title, BasePlugin plugin)
    {
        if (menuType.Contains("CenterHtmlMenu", StringComparison.OrdinalIgnoreCase))
        {
            return new CustomCenterHtmlMenu(title, plugin);
        }
        else
        {
            return new CustomChatMenu(title);
        }
    }
}
