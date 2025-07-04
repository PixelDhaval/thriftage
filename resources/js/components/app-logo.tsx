import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <AppLogoIcon className="size-10 fill-current text-white dark:text-black" />
            <div className="ml-1 grid flex-1 text-left text-lg">
                <span className="truncate leading-none font-semibold ">WareViz</span>
            </div>
        </>
    );
}
