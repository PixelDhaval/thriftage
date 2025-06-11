import * as React from "react"
import AsyncSelect from "react-select/async"
import { ActionMeta, GroupBase, OptionsOrGroups, MultiValue, SingleValue } from "react-select"
import axios from "axios"
import { cn } from "@/lib/utils"

export interface AsyncSelectOption {
  id: string | number
  [key: string]: any  // Allow any additional properties
}

type RenderOptionFn = (option: AsyncSelectOption) => React.ReactNode

interface AsyncSelectProps {
  route: string
  params?: Record<string, any>
  value?: AsyncSelectOption | AsyncSelectOption[] | null
  placeholder?: string
  onChange?: (
    newValue: MultiValue<AsyncSelectOption> | SingleValue<AsyncSelectOption>,
    actionMeta: ActionMeta<AsyncSelectOption>
  ) => void
  className?: string
  searchParam?: string
  debounceMs?: number
  isMulti?: boolean
  isClearable?: boolean
  defaultOptions?: boolean | readonly AsyncSelectOption[]
  renderSelected?: RenderOptionFn | string  // Either a render function or field name
  renderOption?: RenderOptionFn | string    // Either a render function or field name
  valueAttribute?: string // Field to use as the value identifier
  menuIsOpen?: boolean // Add this prop
  onCreate?: (inputValue: string) => void;  // Add this line
}

export function AsyncSelectInput({
  route,
  params = {},
  value,
  placeholder = "Select an option...",
  onChange,
  className,
  searchParam = "search",
  debounceMs = 300,
  isMulti = false,
  isClearable = true,
  defaultOptions = true,
  renderSelected = "text",
  renderOption = "value",
  valueAttribute = "id",
  menuIsOpen, // Remove default forcing menu to stay open
  onCreate,
  ...props
}: AsyncSelectProps) {
  const loadOptions = React.useCallback(
    async (
      inputValue: string
    ): Promise<OptionsOrGroups<AsyncSelectOption, GroupBase<AsyncSelectOption>>> => {
      if (inputValue.length < 2) {
        return []
      }

      try {
        const queryParams = {
          ...params,
          [searchParam]: inputValue,
        }
        
        const response = await axios.get(route, { params: queryParams })
        const data = response.data

        const options = (Array.isArray(data) ? data : data.data || []).map((item: any) => ({
          ...item,
          id: item[valueAttribute] || item.id,
        }))
        
        // Add create option to the results if onCreate is provided
        if (onCreate && inputValue.length >= 2) {
          return [
            ...options,
            {
              id: 'create',
              name: `Create "${inputValue}"`,
              __isNew__: true,
              inputValue
            }
          ]
        }
        
        return options
      } catch (error) {
        console.error("Failed to load options:", error)
        return []
      }
    },
    [route, params, searchParam, valueAttribute, onCreate]
  )

  const formatOptionLabel = React.useCallback(
    (option: AsyncSelectOption, { context }: { context: 'menu' | 'value' }) => {
      // Handle create option differently
      if (option.__isNew__) {
        return (
          <div 
            className="p-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
            onClick={() => onCreate?.(option.inputValue)}
          >
            Create "{option.inputValue}"
          </div>
        )
      }

      const renderer = context === 'value' ? renderSelected : renderOption
      
      if (typeof renderer === 'function') {
        return renderer(option)
      }
      
      return option[renderer] || option.text || option.name || String(option.id)
    },
    [renderSelected, renderOption, onCreate]
  )

  // Remove or modify NoOptionsMessage since we're handling create option in loadOptions
  const NoOptionsMessage = React.useCallback(({ inputValue }: { inputValue: string }) => {
    if (inputValue.length < 2) {
      return <div className="p-2 text-sm text-muted-foreground">Type 2 or more characters to search...</div>;
    }
    return <div className="p-2 text-sm text-muted-foreground">No options found</div>;
  }, []);

  const getOptionValue = (option: AsyncSelectOption) => String(option[valueAttribute])

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      height: '36px',
      minHeight: '36px',
      backgroundColor: 'transparent',
      borderRadius: 'calc(var(--radius) - 2px)',
      boxShadow: state.isFocused ? '0 0 0 3px var(--ring) / 0.5' : 'var(--shadow-xs)',
      padding: '0 6px',
      zIndex: 100,
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
      position: 'absolute',
      width: '100%',
      margin: 0,
      padding: 0,
      zIndex: 99999,
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999, // Higher z-index to ensure menus appear above other elements
      pointerEvents: 'auto', // Enable pointer events on the portal
    }),
    container: (base: any) => ({
      ...base,
      zIndex: 99999,
      position: 'relative',
      isolation: 'isolate',
    }),
    menuList: (base: any) => ({
      ...base,
      backgroundColor: 'var(--popover)',
      border: '1px solid var(--border)',
      borderRadius: 'calc(var(--radius) - 2px)',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      padding: '4px',
      position: 'relative',
      pointerEvents: 'auto',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? 'var(--accent)' : 'transparent',
      color: state.isFocused ? 'var(--accent-foreground)' : 'var(--popover-foreground)',
      fontSize: '14px',
      padding: '6px 8px',
      borderRadius: 'calc(var(--radius) - 4px)',
      cursor: 'pointer',
      position: 'relative',
      pointerEvents: 'auto',
      '&:active': {
        backgroundColor: 'var(--accent)',
      }
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'var(--foreground)',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }),
    input: (base: any) => ({
      ...base,
      color: 'var(--foreground)',
      fontSize: '14px',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'var(--muted-foreground)',
      fontSize: '14px',
    }),
    loadingIndicator: (base: any) => ({
      ...base,
      color: 'var(--muted-foreground)',
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: 'var(--muted-foreground)',
      '&:hover': {
        color: 'var(--foreground)',
      },
      padding: '0 4px',
    }),
    clearIndicator: (base: any) => ({
      ...base,
      color: 'var(--muted-foreground)',
      '&:hover': {
        color: 'var(--foreground)',
      },
      padding: '0 4px',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: 'var(--accent)',
      borderRadius: 'calc(var(--radius) - 4px)',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: 'var(--accent-foreground)',
      fontSize: '14px',
      padding: '2px 6px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: 'var(--accent-foreground)',
      '&:hover': {
        backgroundColor: 'var(--accent)',
        color: 'var(--accent-foreground)',
      },
    }),
  }

  return (
    <AsyncSelect<AsyncSelectOption, boolean>
      value={value}
      onChange={onChange}
      loadOptions={loadOptions}
      defaultOptions={defaultOptions}
      isMulti={isMulti}
      isClearable={isClearable}
      placeholder={placeholder}
      className={cn("w-full text-sm transition-colors focus-within:outline-none", className)}
      classNamePrefix="async-select"
      styles={customStyles}
      formatOptionLabel={formatOptionLabel}
      getOptionValue={getOptionValue}
      closeMenuOnScroll={false}
      menuShouldBlockScroll={true}
      menuShouldScrollIntoView={false}
      loadingMessage={() => "Loading..."}
      noOptionsMessage={({ inputValue }) => (
        <NoOptionsMessage inputValue={inputValue} />
      )}
      menuPortalTarget={document.body} // Portal the menu to the body element
      menuPosition="fixed" // Use fixed positioning
      menuPlacement="auto" // Auto placement to avoid going out of viewport
      {...props}
    />
  );
}