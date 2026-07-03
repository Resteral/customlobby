using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Memory;
using CounterStrikeSharp.API.Modules.Utils;
using CounterStrikeSharp.API.Modules.Commands;


public static class Commands
{
    private static Plugin Instance = Plugin.Instance;
    private static Config config = Instance.Config;
    private static Config_Commands commands = Instance.Config.Commands;
    private static Dictionary<int, Building.BuilderData> BuilderData = Building.Builders;

    public static void Load()
    {
        AddCommands(commands.Admin.BuildMode, BuildMode);
        AddCommands(commands.Admin.ManageBuilder, ManageBuilder);
        AddCommands(commands.Admin.ResetProperties, ResetProperties);
        AddCommands(commands.Admin.Ghost, GhostMode);
        AddCommands(commands.Admin.FreezeTag, ToggleFreezeTag);
        AddCommands(commands.Admin.HideAndSeek, ToggleHideAndSeek);
        AddCommands(commands.Building.BuildMenu, BuildMenu);
        AddCommands(commands.Building.BlockType, BlockType);
        AddCommands(commands.Building.BlockColor, BlockColor);
        AddCommands(commands.Building.CreateBlock, CreateBlock);
        AddCommands(commands.Building.DeleteBlock, DeleteBlock);
        AddCommands(commands.Building.RotateBlock, RotateBlock);
        AddCommands(commands.Building.PositionBlock, PositionBlock);
        AddCommands(commands.Building.SaveBlocks, SaveBlocks);
        AddCommands(commands.Building.Snapping, Snapping);
        AddCommands(commands.Building.Grid, Grid);
        AddCommands(commands.Building.Noclip, Noclip);
        AddCommands(commands.Building.Godmode, Godmode);
        AddCommands(commands.Building.TestBlock, TestBlock);
        AddCommands(commands.Building.ConvertBlock, ConvertBlock);
        AddCommands(commands.Building.CopyBlock, CopyBlock);
        AddCommands(commands.Building.LockBlock, LockBlock);
        AddCommands(commands.Building.LockAll, LockAll);
        Instance.AddCommand("css_savemap", "Save map blocks to custom layout", SaveMap);

        foreach (var cmd in config.Settings.Shop.BuyCommands)
        {
            string commandName = $"css_{cmd}";
            CommandInfo.CommandCallback callback = (player, command) => BuyBuilder(player);
            _registeredActionCommands[commandName] = callback;
            Instance.AddCommand(commandName, "Purchase builder permissions using shop points", callback);
        }
    }
    private static readonly Dictionary<string, CommandInfo.CommandCallback> _registeredActionCommands = new();
    private static readonly Dictionary<string, CommandInfo.CommandCallback> _registeredArgCommands = new();

    private static void AddCommands(List<string> commands, Action<CCSPlayerController?> action)
    {
        foreach (var cmd in commands)
        {
            string commandName = $"css_{cmd}";
            CommandInfo.CommandCallback callback = (player, command) => action(player);
            _registeredActionCommands[commandName] = callback;
            Instance.AddCommand(commandName, "", callback);
        }
    }
    private static void AddCommands(List<string> commands, Action<CCSPlayerController?, string> action)
    {
        foreach (var cmd in commands)
        {
            string commandName = $"css_{cmd}";
            CommandInfo.CommandCallback callback = (player, command) => action(player, command.ArgByIndex(1));
            _registeredArgCommands[commandName] = callback;
            Instance.AddCommand(commandName, "", callback);
        }
    }

    public static void Unload()
    {
        RemoveCommands(commands.Admin.BuildMode, BuildMode);
        RemoveCommands(commands.Admin.ManageBuilder, ManageBuilder);
        RemoveCommands(commands.Admin.ResetProperties, ResetProperties);
        RemoveCommands(commands.Admin.Ghost, GhostMode);
        RemoveCommands(commands.Admin.FreezeTag, ToggleFreezeTag);
        RemoveCommands(commands.Admin.HideAndSeek, ToggleHideAndSeek);
        RemoveCommands(commands.Building.BuildMenu, BuildMenu);
        RemoveCommands(commands.Building.BlockType, BlockType);
        RemoveCommands(commands.Building.BlockColor, BlockColor);
        RemoveCommands(commands.Building.CreateBlock, CreateBlock);
        RemoveCommands(commands.Building.DeleteBlock, DeleteBlock);
        RemoveCommands(commands.Building.RotateBlock, RotateBlock);
        RemoveCommands(commands.Building.PositionBlock, PositionBlock);
        RemoveCommands(commands.Building.SaveBlocks, SaveBlocks);
        RemoveCommands(commands.Building.Snapping, Snapping);
        RemoveCommands(commands.Building.Grid, Grid);
        RemoveCommands(commands.Building.Noclip, Noclip);
        RemoveCommands(commands.Building.Godmode, Godmode);
        RemoveCommands(commands.Building.TestBlock, TestBlock);
        RemoveCommands(commands.Building.ConvertBlock, ConvertBlock);
        RemoveCommands(commands.Building.CopyBlock, CopyBlock);
        RemoveCommands(commands.Building.LockBlock, LockBlock);
        RemoveCommands(commands.Building.LockAll, LockAll);
        Instance.RemoveCommand("css_savemap", SaveMap);

        foreach (var cmd in config.Settings.Shop.BuyCommands)
        {
            string commandName = $"css_{cmd}";
            if (_registeredActionCommands.TryGetValue(commandName, out var callback))
            {
                Instance.RemoveCommand(commandName, callback);
                _registeredActionCommands.Remove(commandName);
            }
        }
    }
    private static void RemoveCommands(List<string> commands, Action<CCSPlayerController?> action)
    {
        foreach (var cmd in commands)
        {
            string commandName = $"css_{cmd}";
            if (_registeredActionCommands.TryGetValue(commandName, out var callback))
            {
                Instance.RemoveCommand(commandName, callback);
                _registeredActionCommands.Remove(commandName);
            }
        }
    }
    private static void RemoveCommands(List<string> commands, Action<CCSPlayerController?, string> action)
    {
        foreach (var cmd in commands)
        {
            string commandName = $"css_{cmd}";
            if (_registeredArgCommands.TryGetValue(commandName, out var callback))
            {
                Instance.RemoveCommand(commandName, callback);
                _registeredArgCommands.Remove(commandName);
            }
        }
    }

    private static bool AllowedCommand(CCSPlayerController? player)
    {
        if (player == null || player.NotValid())
            return false;

        if (!Utils.BuildMode(player))
            return false;

        return true;
    }

    private static void ToggleCommand(CCSPlayerController player, ref bool commandStatus, string commandName)
    {
        commandStatus = !commandStatus;

        string status = commandStatus ? "ON" : "OFF";
        char color = commandStatus ? ChatColors.Green : ChatColors.Red;

        Utils.PrintToChat(player, $"{commandName}: {color}{status}");
    }

    public static void BuildMode(CCSPlayerController? player)
    {
        if (player == null || player.NotValid())
            return;

        if (!Utils.HasPermission(player))
        {
            Utils.PrintToChatAll($"{ChatColors.Red}You don't have permission to change Build Mode");
            return;
        }

        if (!Building.BuildMode)
        {
            Building.BuildMode = true;
            foreach (var target in Utilities.GetPlayers().Where(p => !p.IsBot))
            {
                if (Utils.HasPermission(target) || Files.Builders.steamids.Contains(target.SteamID.ToString()))
                {
                    BuilderData[target.Slot] = new Building.BuilderData { BlockType = Blocks.Models.Data.Platform.Title };
                    Building.BuilderHolds[target] = new Building.BuildData();
                }
            }
        }
        else
        {
            Building.BuildMode = false;
            BuilderData.Clear();
            Building.BuilderHolds.Clear();
        }

        string status = Building.BuildMode ? "Enabled" : "Disabled";
        char color = Building.BuildMode ? ChatColors.Green : ChatColors.Red;

        Utils.PrintToChatAll($"Build Mode: {color}{status} {ChatColors.Grey}by {ChatColors.LightPurple}{player.PlayerName}");
    }

    public static void ManageBuilder(CCSPlayerController? player, string input)
    {
        if (player == null || !AllowedCommand(player))
            return;

        if (!Utils.HasPermission(player))
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}You don't have permission to manage Builders");
            return;
        }

        var targetPlayer = Utilities.GetPlayers()
            .FirstOrDefault(target => target.SteamID.ToString() == input);

        if (string.IsNullOrEmpty(input) || targetPlayer == null)
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}Player not found");
            return;
        }

        bool isBuilder = BuilderData.TryGetValue(targetPlayer.Slot, out var builderData);

        if (isBuilder)
            BuilderData.Remove(targetPlayer.Slot);

        else BuilderData[targetPlayer.Slot] = new Building.BuilderData { BlockType = Blocks.Models.Data.Platform.Title };

        var action = isBuilder ? "removed" : "granted";
        var color = isBuilder ? ChatColors.Red : ChatColors.Green;

        Utils.PrintToChat(targetPlayer, $"{ChatColors.LightPurple}{player.PlayerName} {color}{action} your access to Build");
        Utils.PrintToChat(player, $"{color}You {action} {ChatColors.LightPurple}{targetPlayer.PlayerName} {color}access to Build");

        var builders = Files.Builders.steamids;
        string steamId = targetPlayer.SteamID.ToString();

        if (isBuilder && builders.Contains(steamId))
            builders.Remove(steamId);

        else
        {
            if (!builders.Contains(steamId))
                builders.Add(steamId);
        }

        Files.Builders.Save(builders);
    }

    public static void BuildMenu(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        if (!Utils.BuildMode(player))
            return;

        Menu.Open(player, "Block Maker");
    }

    public static void BlockType(CCSPlayerController? player, string selectType)
    {
        if (player == null || !AllowedCommand(player))
            return;

        if (string.IsNullOrEmpty(selectType))
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}No block type specified");
            return;
        }

        if (string.Equals("Teleport", selectType, StringComparison.OrdinalIgnoreCase))
        {
            BuilderData[player.Slot].BlockType = "Teleport";
            Utils.PrintToChat(player, $"Selected Type: {ChatColors.White}Teleport");
            return;
        }

        var blockModels = Blocks.Models.Data;
        foreach (var model in blockModels.GetAllBlocks())
        {
            if (string.Equals(model.Title, selectType, StringComparison.OrdinalIgnoreCase))
            {
                BuilderData[player.Slot].BlockType = model.Title;
                Utils.PrintToChat(player, $"Selected Type: {ChatColors.White}{model.Title}");
                return;
            }
        }

        Utils.PrintToChat(player, $"{ChatColors.Red}Could not find {ChatColors.White}{selectType} {ChatColors.Red}in block types");
    }

    public static void BlockColor(CCSPlayerController? player, string selectColor = "None")
    {
        if (player == null || !AllowedCommand(player))
            return;

        if (string.IsNullOrEmpty(selectColor))
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}No color specified");
            return;
        }

        foreach (var color in Utils.ColorMapping.Keys)
        {
            if (string.Equals(color, selectColor, StringComparison.OrdinalIgnoreCase))
            {
                BuilderData[player.Slot].BlockColor = color;
                Utils.PrintToChat(player, $"Selected Color: {ChatColors.White}{color}");

                Blocks.RenderColor(player);

                return;
            }
        }

        Utils.PrintToChat(player, $"{ChatColors.Red}Could not find a matching color");
    }

    public static void CreateBlock(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.Create(player);
    }

    public static void DeleteBlock(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.Delete(player);
    }

    public static void RotateBlock(CCSPlayerController? player, string rotation)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.Position(player, rotation, true);
    }

    public static void PositionBlock(CCSPlayerController? player, string position)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.Position(player, position, false);
    }

    public static void SaveBlocks(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        if (Utils.GetPlacedBlocksCount() <= 0)
        {
            Utils.PrintToChatAll($"{ChatColors.Red}No blocks to save");
            return;
        }

        Files.EntitiesData.Save();
    }

    public static void Snapping(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        ToggleCommand(player, ref BuilderData[player.Slot].Snapping, "Block Snapping");
    }

    public static void Grid(CCSPlayerController? player, string grid)
    {
        if (player == null || !AllowedCommand(player))
            return;

        if (string.IsNullOrEmpty(grid))
        {
            ToggleCommand(player, ref BuilderData[player.Slot].Grid, "Block Grid");
            return;
        }

        BuilderData[player.Slot].GridValue = float.Parse(grid);

        Utils.PrintToChat(player, $"Selected Grid: {ChatColors.White}{grid} Units");
    }

    public static void Noclip(CCSPlayerController? player)
    {
        if (player == null || player.NotValid())
            return;

        if (!Utils.BuildMode(player))
            return;

        ToggleCommand(player, ref BuilderData[player.Slot].Noclip, "Noclip");

        if (BuilderData[player.Slot].Noclip)
        {
            player.Pawn.Value!.MoveType = MoveType_t.MOVETYPE_NOCLIP;
            Schema.SetSchemaValue(player.Pawn.Value!.Handle, "CBaseEntity", "m_nActualMoveType", 8); // noclip
            Utilities.SetStateChanged(player.Pawn.Value!, "CBaseEntity", "m_MoveType");
        }

        else if (!BuilderData[player.Slot].Noclip)
        {
            player.Pawn.Value!.MoveType = MoveType_t.MOVETYPE_WALK;
            Schema.SetSchemaValue(player!.Pawn.Value!.Handle, "CBaseEntity", "m_nActualMoveType", 2); // walk
            Utilities.SetStateChanged(player!.Pawn.Value!, "CBaseEntity", "m_MoveType");
        }
    }

    public static void Godmode(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        ToggleCommand(player, ref BuilderData[player.Slot].Godmode, "Godmode");

        if (BuilderData[player.Slot].Godmode)
            player.Pawn()!.TakesDamage = false;

        else player.Pawn()!.TakesDamage = true;
    }

    public static void TestBlock(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.Test(player);
    }

    public static void ClearBlocks(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.Delete(player, true);

        Utils.PlaySoundAll(config.Sounds.Building.Delete);
        Utils.PrintToChatAll($"{ChatColors.Red}Blocks cleared by {ChatColors.LightPurple}{player.PlayerName}");
    }

    public static void ConvertBlock(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.Convert(player);
    }

    public static void CopyBlock(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.Copy(player);
    }

    public static void LockBlock(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.Lock(player);
    }

    public static void LockAll(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.LockAll(player);
    }

    public static void TransparencyBlock(CCSPlayerController? player, string transparency = "100%")
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.Transparency(player, transparency);
    }

    public static void EffectBlock(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;
        
        Blocks.ChangeEffect(player);
    }

    public static void TeamBlock(CCSPlayerController? player, string team = "Both")
    {
        if (player == null || !AllowedCommand(player))
            return;

        var entity = player.GetBlockAim();

        if (entity == null || entity.Entity == null || string.IsNullOrEmpty(entity.Entity.Name))
            return;

        if (Blocks.Entities.TryGetValue(entity, out var block))
        {
            if (Utils.BlockLocked(player, block))
                return;

            Blocks.Entities[entity].Team = team;
            Utils.PrintToChat(player, $"Changed block team to {ChatColors.White}{team}");
        }
    }

    public static void Pole(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        ToggleCommand(player, ref BuilderData[player.Slot].BlockPole, "Pole");
    }

    public static void Properties(CCSPlayerController? player, string type, string input)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Blocks.ChangeProperties(player, type, input);
    }

    public static void LightSettings(CCSPlayerController? player, string type, string input)
    {
        if (player == null || !AllowedCommand(player))
            return;

        Lights.Settings(player, type, input);
    }

    public static void ResetProperties(CCSPlayerController? player)
    {
        if (player == null || !AllowedCommand(player))
            return;

        if (!Utils.HasPermission(player))
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}You don't have permission to reset properties");
            return;
        }

        foreach (var block in Blocks.Entities.Values)
        {
            if (Blocks.Properties.BlockProperties.TryGetValue(block.Type.Split('.')[0], out var defaultProperties))
            {
                block.Properties = new Blocks.Property
                {
                    Cooldown = defaultProperties.Cooldown,
                    Value = defaultProperties.Value,
                    Duration = defaultProperties.Duration,
                    OnTop = defaultProperties.OnTop,
                    Locked = defaultProperties.Locked,
                    Builder = block.Properties.Builder,
                };
            }
            else Utils.PrintToChatAll($"{ChatColors.Red}Failed to find {ChatColors.White}{block.Type} {ChatColors.Red}default properties");
        }
        Utils.PrintToChatAll($"{ChatColors.Red}All placed blocks properties have been reset!");
    }

    public static void SaveMap(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || player.NotValid())
            return;

        if (!Utils.HasPermission(player))
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}You don't have permission to save map layouts");
            return;
        }

        string layoutName = command.ArgByIndex(1).Trim();
        if (string.IsNullOrEmpty(layoutName))
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}Usage: !savemap <layout_name>");
            return;
        }

        // Sanitize layout name (letters, numbers, underscores only)
        layoutName = System.Text.RegularExpressions.Regex.Replace(layoutName, @"[^a-zA-Z0-9_]", "");
        if (string.IsNullOrEmpty(layoutName))
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}Invalid layout name.");
            return;
        }

        if (Utils.GetPlacedBlocksCount() <= 0)
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}No blocks to save");
            return;
        }

        string virtualMapName = $"{Server.MapName}_{layoutName}";
        string originalMapsFolder = Files.mapsFolder;

        // Temporarily override mapsFolder to save blocks to the custom layout folder
        Files.mapsFolder = System.IO.Path.Combine(Instance.ModuleDirectory, "maps", virtualMapName);
        System.IO.Directory.CreateDirectory(Files.mapsFolder);

        Files.EntitiesData.Save();

        // Restore original mapsFolder
        Files.mapsFolder = originalMapsFolder;

        Utils.PrintToChat(player, $"Virtual layout {ChatColors.Green}{layoutName}{ChatColors.Grey} saved successfully!");

        // Write to HnsModeRotator's maps_rotation.json
        AppendToRotation(virtualMapName);
    }

    private static void AppendToRotation(string virtualMapName)
    {
        try
        {
            string pluginsDir = System.IO.Path.GetDirectoryName(Instance.ModuleDirectory) ?? "";
            string rotatorConfigPath = System.IO.Path.Combine(pluginsDir, "HnsModeRotator", "maps_rotation.json");

            List<string> mapList = new();
            if (System.IO.File.Exists(rotatorConfigPath))
            {
                string content = System.IO.File.ReadAllText(rotatorConfigPath);
                mapList = System.Text.Json.JsonSerializer.Deserialize<List<string>>(content) ?? new();
            }

            if (!mapList.Contains(virtualMapName))
            {
                mapList.Add(virtualMapName);
                string newContent = System.Text.Json.JsonSerializer.Serialize(mapList, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                System.IO.File.WriteAllText(rotatorConfigPath, newContent);
            }
        }
        catch (Exception ex)
        {
            Utils.Log($"Failed to append virtual map to rotation: {ex.Message}");
        }
    }

    public static void BuyBuilder(CCSPlayerController? player)
    {
        if (player == null || player.NotValid())
            return;

        if (!config.Settings.Shop.Enabled)
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}Shop purchase is disabled.");
            return;
        }

        if (!ShopIntegration.IsRotatorLoaded())
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}Shop system is currently unavailable.");
            return;
        }

        Files.Builders.Load();

        if (Utils.HasPermission(player) || Files.Builders.steamids.Contains(player.SteamID.ToString()))
        {
            Utils.PrintToChat(player, $"{ChatColors.Green}You already have builder permissions!");
            return;
        }

        int price = config.Settings.Shop.BuilderPrice;
        int points = ShopIntegration.GetPlayerPoints(player);

        if (points < price)
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}You need {ChatColors.White}{price} {ChatColors.Red}points to buy builder access. You currently have {ChatColors.White}{points} {ChatColors.Red}points.");
            return;
        }

        if (ShopIntegration.DeductPlayerPoints(player, price))
        {
            Files.Builders.steamids.Add(player.SteamID.ToString());
            Files.Builders.Save(Files.Builders.steamids);

            // Initialize builder data
            Building.Builders[player.Slot] = new Building.BuilderData { BlockType = Blocks.Models.Data.Platform.Title };

            Utils.PrintToChat(player, $"{ChatColors.Green}Successfully purchased builder access for {ChatColors.White}{price} {ChatColors.Green}points!");
            Utils.PrintToChat(player, $"Type {ChatColors.White}!bm {ChatColors.Grey}to open the building menu.");
            
            if (config.Sounds.Building.Enabled)
                player.EmitSound(config.Sounds.Building.Save);
        }
        else
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}Failed to complete purchase. Please try again.");
        }
    }

    // ── Ghost / Observer Mode ────────────────────────────────────────────────
    // Lets an admin walk the map invisibly without affecting gameplay.
    public static HashSet<int> GhostPlayers = new();

    public static void GhostMode(CCSPlayerController? player)
    {
        if (player == null || player.NotValid()) return;

        if (!Utils.HasPermission(player))
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}You don't have permission to use ghost mode.");
            return;
        }

        var pawn = player.PlayerPawn.Value;
        if (pawn == null) return;

        if (GhostPlayers.Contains(player.Slot))
        {
            // ── Disable ghost mode ──
            GhostPlayers.Remove(player.Slot);

            // Restore visibility
            pawn.Render = System.Drawing.Color.FromArgb(255, pawn.Render.R, pawn.Render.G, pawn.Render.B);
            Utilities.SetStateChanged(pawn, "CBaseModelEntity", "m_clrRender");

            // Restore walk
            pawn.MoveType = MoveType_t.MOVETYPE_WALK;
            CounterStrikeSharp.API.Modules.Memory.Schema.SetSchemaValue(pawn.Handle, "CBaseEntity", "m_nActualMoveType", 2);
            Utilities.SetStateChanged(pawn, "CBaseEntity", "m_MoveType");

            // Restore damage
            pawn.TakesDamage = true;

            Utils.PrintToChat(player, $"{ChatColors.Green}Ghost mode {ChatColors.Red}OFF {ChatColors.Grey}— you are visible again.");
        }
        else
        {
            // ── Enable ghost mode ──
            GhostPlayers.Add(player.Slot);

            // Make nearly invisible (alpha 20 — you can still see yourself)
            pawn.Render = System.Drawing.Color.FromArgb(20, pawn.Render.R, pawn.Render.G, pawn.Render.B);
            Utilities.SetStateChanged(pawn, "CBaseModelEntity", "m_clrRender");

            // Noclip
            pawn.MoveType = MoveType_t.MOVETYPE_NOCLIP;
            CounterStrikeSharp.API.Modules.Memory.Schema.SetSchemaValue(pawn.Handle, "CBaseEntity", "m_nActualMoveType", 8);
            Utilities.SetStateChanged(pawn, "CBaseEntity", "m_MoveType");

            // Invincible
            pawn.TakesDamage = false;

            Utils.PrintToChat(player, $"{ChatColors.Green}Ghost mode {ChatColors.Green}ON {ChatColors.Grey}— noclip, invisible, no block interactions.");
            Utils.PrintToChat(player, $"{ChatColors.Grey}Type {ChatColors.White}!ghost {ChatColors.Grey}again to return to normal.");
        }
    }

    public static void ToggleFreezeTag(CCSPlayerController? player)
    {
        if (player != null && !Utils.HasPermission(player))
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}You don't have permission to use Freeze Tag.");
            return;
        }
        FreezeTagManager.Toggle(player);
    }

    public static void ToggleHideAndSeek(CCSPlayerController? player)
    {
        if (player != null && !Utils.HasPermission(player))
        {
            Utils.PrintToChat(player, $"{ChatColors.Red}You don't have permission to use Hide and Seek.");
            return;
        }
        HideAndSeekManager.Toggle(player);
    }
}